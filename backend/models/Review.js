const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true, // Only one review per booking
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please add a rating between 1 and 5'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Please add a comment'],
      trim: true,
      maxlength: [500, 'Comment cannot be more than 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Statics method to get average rating of a skill
ReviewSchema.statics.getAverageRating = async function (skillId) {
  const obj = await this.aggregate([
    {
      $match: { skill: skillId },
    },
    {
      $group: {
        _id: '$skill',
        averageRating: { $avg: '$rating' },
        reviewsCount: { $sum: 1 },
      },
    },
  ]);

  try {
    if (obj.length > 0) {
      await this.model('Skill').findByIdAndUpdate(skillId, {
        averageRating: Math.round(obj[0].averageRating * 10) / 10,
        reviewsCount: obj[0].reviewsCount,
      });
    } else {
      await this.model('Skill').findByIdAndUpdate(skillId, {
        averageRating: 0,
        reviewsCount: 0,
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
ReviewSchema.post('save', function () {
  this.constructor.getAverageRating(this.skill);
});

// Call getAverageRating before remove (if deleted)
ReviewSchema.post('remove', function () {
  this.constructor.getAverageRating(this.skill);
});

module.exports = mongoose.model('Review', ReviewSchema);
